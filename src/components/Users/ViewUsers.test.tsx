import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ViewUsers from "./ViewUsers";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("../../utils/axiosConfig", () => ({
  default: {
    get: getMock,
    patch: vi.fn(),
  },
}));

describe("ViewUsers", () => {
  it("renders N/A when a non-admin user has a null role", async () => {
    getMock.mockResolvedValueOnce({
      data: {
        total: 3,
        items: [
          {
            id: 1,
            full_name: "No Role User",
            username: "no-role",
            email: "no-role@example.com",
            role: null,
            is_admin: false,
            disabled: false,
          },
          {
            id: 2,
            full_name: "Administrator",
            username: "admin",
            email: "admin@example.com",
            role: null,
            is_admin: true,
            disabled: false,
          },
          {
            id: 3,
            full_name: "Manager User",
            username: "manager",
            email: "manager@example.com",
            role: "manager",
            is_admin: false,
            disabled: false,
          },
        ],
      },
    });

    render(<ViewUsers />);

    expect(await screen.findByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });
});
