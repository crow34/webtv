import { Program } from '../types/channel';
import { XMLParser } from 'fast-xml-parser';
import { fetchWithRetry } from './fetchUtils';

interface EPGProgram {
  '@_start': string;
  '@_stop': string;
  '@_channel': string;
  title: string | { '#text': string }[] | { '#text': string };
  desc?: string | { '#text': string }[] | { '#text': string };
}

function normalizeDateTime(dateStr: string): string {
  try {
    // Remove any whitespace
    dateStr = dateStr.trim();
    
    // Handle empty or invalid input
    if (!dateStr) {
      throw new Error('Empty date string');
    }
    
    // If the date is in YYYYMMDDhhmmss format without timezone, assume UTC
    if (/^\d{14}$/.test(dateStr)) {
      return `${dateStr} +0000`;
    }
    
    // If the date has a space before the timezone, normalize it
    return dateStr.replace(/\s+([+-]\d{4})$/, '$1');
  } catch (error) {
    throw new Error(`Failed to normalize date: ${dateStr}`);
  }
}

function parseDateTime(dateStr: string): Date {
  try {
    const normalized = normalizeDateTime(dateStr);
    
    // Parse YYYYMMDDhhmmss ±0000 format
    const match = normalized.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})$/);
    if (match) {
      const [, year, month, day, hour, minute, second, offset] = match;
      const offsetHours = parseInt(offset.slice(0, 3));
      const offsetMinutes = parseInt(offset.slice(3));
      
      const date = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      ));
      
      // Validate the date components
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date components');
      }
      
      date.setHours(date.getHours() + offsetHours);
      date.setMinutes(date.getMinutes() + offsetMinutes);
      
      return date;
    }
    
    // Fallback to standard date parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date;
  } catch (e) {
    throw new Error(`Invalid date format: ${dateStr} - ${e.message}`);
  }
}

function extractTextContent(field: string | { '#text': string }[] | { '#text': string } | undefined): string {
  try {
    if (!field) return '';
    if (typeof field === 'string') return field.trim();
    if (Array.isArray(field)) {
      return field
        .map(item => {
          if (typeof item === 'string') return item;
          return item['#text'] || '';
        })
        .filter(text => text.trim().length > 0)
        .join(' ')
        .trim();
    }
    return (typeof field === 'string' ? field : field['#text'] || '').trim();
  } catch (error) {
    console.warn('Error extracting text content:', error);
    return '';
  }
}

async function parseXMLWithRetry(text: string, retries = 3): Promise<any> {
  let lastError: Error | undefined;
  
  // Validate XML structure before parsing
  if (!text.includes('<?xml') && !text.includes('<tv>')) {
    throw new Error('Invalid XML structure');
  }
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    trimValues: true,
    parseTagValue: true,
    allowBooleanAttributes: true,
    cdataPropName: '__cdata',
    removeNSPrefix: true, // Remove namespace prefixes
    numberParseOptions: {
      hex: true,
      leadingZeros: true
    },
    tagValueProcessor: (tagName: string, tagValue: string) => {
      return tagValue?.trim() || '';
    },
    stopNodes: ['*.desc', '*.title'] // Prevent parsing inside these tags
  });
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = parser.parse(text);
      
      // Validate parsed structure
      if (!result?.tv) {
        throw new Error('Missing root tv element');
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`XML parsing attempt ${i + 1} failed:`, lastError.message);
      
      if (i === retries - 1) {
        throw new Error(`Failed to parse XML after ${retries} attempts: ${lastError.message}`);
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError;
}

function validateProgram(prog: EPGProgram): boolean {
  try {
    // Check required fields
    if (!prog['@_start'] || !prog['@_stop'] || !prog['@_channel']) {
      return false;
    }

    // Validate dates
    const start = parseDateTime(prog['@_start']);
    const end = parseDateTime(prog['@_stop']);
    
    // Ensure end is after start
    if (end <= start) {
      return false;
    }
    
    // Ensure dates are not too far in the past or future
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (start < oneYearAgo || end > oneYearFromNow) {
      return false;
    }

    // Validate title
    const title = extractTextContent(prog.title);
    return title.length > 0;
  } catch {
    return false;
  }
}

export async function parseEPG(url: string): Promise<Program[]> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    
    const text = await response.text();
    
    if (!text.trim()) {
      console.warn('Empty EPG data received');
      return [];
    }
    
    const json = await parseXMLWithRetry(text);
    
    if (!json?.tv?.programme) {
      console.warn('No programme data found in EPG');
      return [];
    }
    
    const programmes = Array.isArray(json.tv.programme) 
      ? json.tv.programme 
      : [json.tv.programme];
    
    const validPrograms = programmes
      .filter((prog: EPGProgram) => validateProgram(prog))
      .map((prog: EPGProgram) => {
        try {
          return {
            id: `${prog['@_channel']}-${prog['@_start']}`,
            title: extractTextContent(prog.title),
            description: extractTextContent(prog.desc),
            start: parseDateTime(prog['@_start']),
            end: parseDateTime(prog['@_stop']),
            channelId: prog['@_channel']
          };
        } catch (e) {
          console.warn('Error parsing programme:', e);
          return null;
        }
      })
      .filter((prog): prog is Program => prog !== null);
    
    if (validPrograms.length === 0) {
      console.warn('No valid programs found in EPG data');
      return [];
    }
    
    // Sort programs by start time
    validPrograms.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    console.log(`Successfully parsed ${validPrograms.length} programs`);
    return validPrograms;
  } catch (error) {
    console.error('Error parsing EPG:', error);
    // Return empty array instead of throwing to prevent UI disruption
    return [];
  }
}