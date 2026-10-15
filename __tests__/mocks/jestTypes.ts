// Jest 30 resolves `jest.Mock<any>` to a mock whose mockResolvedValue /
// mockRejectedValue only accept `never`; type async mocks with this instead.
export type AsyncMock = (...args: any[]) => Promise<any>;
