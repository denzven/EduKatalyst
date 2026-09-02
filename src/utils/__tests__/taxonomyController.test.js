import { describe, it, expect, beforeEach } from 'vitest';
import { aggregateAllSubjects, aggregateAllTags, registerSubject, registerTag } from '../taxonomyController';

describe('taxonomyController', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should aggregate subjects from sessions, notes, and quizzes', () => {
    const notes = [{ subject: 'Physics' }, { subject: 'Computer Science' }];
    const subjects = aggregateAllSubjects([], notes, []);
    const subjectNames = subjects.map(s => s.name);

    expect(subjectNames).toContain('Physics');
    expect(subjectNames).toContain('Computer Science');
  });

  it('should register custom subjects into local storage', () => {
    registerSubject('Quantum Engineering');
    const subjects = aggregateAllSubjects([], [], []);
    const subjectNames = subjects.map(s => s.name);

    expect(subjectNames).toContain('Quantum Engineering');
  });

  it('should register custom tags into local storage', () => {
    registerTag('thermodynamics');
    const tags = aggregateAllTags([], [], []);
    const tagNames = tags.map(t => t.name);

    expect(tagNames).toContain('thermodynamics');
  });
});
