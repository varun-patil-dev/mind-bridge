export const TOPICS = [
  'General support',
  'Stress & studies',
  'Relationships',
  'Work & life',
  'Emotional wellbeing',
];

export const getProblemTopic = (problem) =>
  TOPICS.includes(problem?.topic) ? problem.topic : 'General support';
