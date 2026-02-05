/**
 * Seed Data
 *
 * Demo items for testing and demonstration purposes.
 */

import { saveItem } from "./data.js";
import type { Item } from "./types.js";
import { createItem } from "./utils.js";

/**
 * Demo item templates.
 */
const DEMO_ITEMS: Array<{ title: string; content?: string }> = [
  {
    title: "Review project proposal",
    content: "Check the Q2 roadmap document and provide feedback by Friday",
  },
  {
    title: "Buy groceries",
    content: "Milk, eggs, bread, coffee, bananas",
  },
  {
    title: "Schedule dentist appointment",
  },
  {
    title: "Finish reading chapter 5",
    content: "The Design of Everyday Things - Norman",
  },
  {
    title: "Reply to Sarah's email",
    content: "About the team lunch next week",
  },
];

/**
 * Generate demo items and save them to storage.
 *
 * Returns the created items.
 */
export const seedItems = async (): Promise<Item[]> => {
  const items: Item[] = [];

  for (const demo of DEMO_ITEMS) {
    const item = createItem({ title: demo.title, content: demo.content });
    await saveItem({ item });
    items.push(item);
  }

  return items;
};
