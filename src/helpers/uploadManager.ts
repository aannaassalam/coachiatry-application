// Simple singleton upload manager to track AbortControllers by message tempId

const uploadControllers = new Map<string, AbortController[]>();

export const uploadManager = {
  add(tempId: string, controller: AbortController) {
    if (!uploadControllers.has(tempId)) {
      uploadControllers.set(tempId, []);
    }
    uploadControllers.get(tempId)!.push(controller);
  },

  cancel(tempId: string) {
    const controllers = uploadControllers.get(tempId);
    if (controllers) {
      controllers.forEach((c) => c.abort());
      uploadControllers.delete(tempId);
    }
  },

  clear(tempId: string) {
    uploadControllers.delete(tempId);
  }
};
