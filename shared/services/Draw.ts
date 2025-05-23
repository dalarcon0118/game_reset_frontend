import { DrawType } from '@/types';
import { mockDraws } from '@/data/mockData';

// Simulate server response delay
const RESPONSE_DELAY = 500;

export class DrawService {
  // Get a single draw by ID
  static getOne(id: string): Promise<DrawType | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const draw = mockDraws.find(draw => draw.id === id);
        resolve(draw || null);
      }, RESPONSE_DELAY);
    });
  }

  // Get all draws
  static list(): Promise<DrawType[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockDraws]);
      }, RESPONSE_DELAY);
    });
  }

  // Filter draws based on criteria
  static filter(criteria: {
    source?: string;
    time?: string;
    status?: 'active' | 'inactive';
  }): Promise<DrawType[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredDraws = [...mockDraws];

        if (criteria.source) {
          filteredDraws = filteredDraws.filter(draw => 
            draw.source.toLowerCase().includes(criteria.source!.toLowerCase())
          );
        }

        if (criteria.time) {
          filteredDraws = filteredDraws.filter(draw => 
            draw.time.toLowerCase().includes(criteria.time!.toLowerCase())
          );
        }

        if (criteria.status) {
          filteredDraws = filteredDraws.filter(draw => 
            draw.status === criteria.status
          );
        }

        resolve(filteredDraws);
      }, RESPONSE_DELAY);
    });
  }
}