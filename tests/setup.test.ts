// Simple test to verify Jest setup is working
describe('Jest Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support TypeScript', () => {
    const greeting: string = 'Hello Jest!';
    expect(greeting).toBe('Hello Jest!');
  });
});