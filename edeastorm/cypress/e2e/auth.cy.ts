describe('Authentication Flow', () => {
  it('loads the sign in page and shows providers', () => {
    cy.visit('/auth/signin');
    // Verify page title/header
    cy.contains('Sign in to Edeastorm'); // Adjust based on actual text
    
    // Verify Providers
    cy.contains('Sign in with Google');
    cy.contains('Sign in with GitHub');
  });
});
