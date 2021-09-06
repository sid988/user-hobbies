import { PassionLevel } from './PassionLevel'

export interface Hobby {
    id: string;
    name: string;
    passionLevel: PassionLevel;
    year: number;
    userId: string;
}