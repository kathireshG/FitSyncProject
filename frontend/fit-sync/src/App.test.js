import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("axios", () => ({
  defaults: {},
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

test("renders the login page for an unauthenticated visitor", async () => {
  window.localStorage.clear();
  render(<App />);
  expect(await screen.findByText(/sign in to your account/i)).toBeInTheDocument();
});
