#!/usr/bin/env node

/**
 * Task Scheduler
 * Uses node-cron to schedule tasks
 */

import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TaskScheduler {
  constructor() {
    this.tasks = new Map();
    this.schedule = process.env.FETCH_SCHEDULE || '0 8 * * *'; // Default: 8 AM daily
  }

  scheduleTask(name, cronExpression, taskFn) {
    if (this.tasks.has(name)) {
      console.warn(`⚠️  Task ${name} already scheduled, skipping`);
      return;
    }

    if (!cron.validate(cronExpression)) {
      console.error(`❌ Invalid cron expression: ${cronExpression}`);
      return;
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Running task: ${name} at ${new Date().toISOString()}`);
      try {
        await taskFn();
        console.log(`✅ Task ${name} completed`);
      } catch (error) {
        console.error(`❌ Task ${name} failed:`, error);
      }
    }, {
      scheduled: false,
      timezone: process.env.BRIEFING_TIMEZONE || 'Asia/Shanghai'
    });

    this.tasks.set(name, task);
    console.log(`✅ Task ${name} scheduled: ${cronExpression}`);
  }

  startTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.start();
      console.log(`▶️  Task ${name} started`);
    }
  }

  stopTask(name) {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      console.log(`⏸️  Task ${name} stopped`);
    }
  }

  startAll() {
    for (const [name, task] of this.tasks.entries()) {
      task.start();
      console.log(`▶️  Task ${name} started`);
    }
  }

  stopAll() {
    for (const [name, task] of this.tasks.entries()) {
      task.stop();
      console.log(`⏸️  Task ${name} stopped`);
    }
  }

  listTasks() {
    console.log('📋 Scheduled tasks:');
    for (const name of this.tasks.keys()) {
      console.log(`  - ${name}`);
    }
  }
}

export default TaskScheduler;
