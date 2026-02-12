import waterLesson from "../data/lessons/water.json";
import mineralsLesson from "../data/lessons/minerals.json";
import projectsLesson from "../data/lessons/projects.json";
import type { Lesson } from "../types";

export const LESSONS: Lesson[] = [waterLesson as Lesson, mineralsLesson as Lesson, projectsLesson as Lesson];

export function getLesson(id: string): Lesson {
  const l = LESSONS.find((x) => x.id === id);
  return (l ?? LESSONS[0]) as Lesson;
}
