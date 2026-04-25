class MemoryStore {
  constructor() {
    this.observations = [];
    this.scheduledReplies = [];
    this.nextScheduledId = 1;
  }

  addObservation(entry) {
    this.observations.push(entry);
    if (this.observations.length > 1000) {
      this.observations.shift();
    }
  }

  getRecentObservations(limit = 20) {
    return this.observations.slice(-limit);
  }

  createScheduledReply(payload) {
    const scheduled = {
      id: this.nextScheduledId++,
      status: "pending",
      createdAt: new Date().toISOString(),
      completedAt: null,
      ...payload
    };
    this.scheduledReplies.push(scheduled);
    return scheduled;
  }

  completeScheduledReply(id, generatedReply) {
    const item = this.scheduledReplies.find((entry) => entry.id === id);
    if (!item) return null;

    item.status = "completed";
    item.generatedReply = generatedReply;
    item.completedAt = new Date().toISOString();
    return item;
  }

  failScheduledReply(id, errorMessage) {
    const item = this.scheduledReplies.find((entry) => entry.id === id);
    if (!item) return null;

    item.status = "failed";
    item.error = errorMessage;
    item.completedAt = new Date().toISOString();
    return item;
  }

  getScheduledReplies() {
    return this.scheduledReplies
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export const store = new MemoryStore();
