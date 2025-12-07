// A simple singleton to pass state between stacked modals without URL param complexity
export const TempStore = {
  newlyCreatedAccountId: null as string | null,
  newlyCreatedCategoryId: null as string | null,
  
  setNewAccount(id: string) { this.newlyCreatedAccountId = id; },
  getNewAccount() { 
    const id = this.newlyCreatedAccountId; 
    this.newlyCreatedAccountId = null; // Clear after reading
    return id; 
  },

  setNewCategory(id: string) { this.newlyCreatedCategoryId = id; },
  getNewCategory() { 
    const id = this.newlyCreatedCategoryId; 
    this.newlyCreatedCategoryId = null; 
    return id; 
  }
};