import bank from '../../exam-data/practical/questions.json';
import type { PracticalGroup, PracticalQuestion } from './types';

export const BANK_VERSION = bank.bankVersion;

export const practicalGroups = bank.groups as PracticalGroup[];

export const practicalQuestions = bank.questions as PracticalQuestion[];
