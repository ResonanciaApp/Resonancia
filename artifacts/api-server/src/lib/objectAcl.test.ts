import { describe, expect, it, vi } from "vitest";
import type { File } from "@google-cloud/storage";
import {
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
} from "./objectAcl";

function fakeFile(policy?: unknown): File {
  return {
    getMetadata: vi.fn(async () => [
      policy === undefined
        ? {}
        : {
            metadata: {
              "custom:aclPolicy":
                typeof policy === "string" ? policy : JSON.stringify(policy),
            },
          },
    ]),
  } as unknown as File;
}

describe("object ACL policy", () => {
  it("allows anonymous reads only for a valid public policy", async () => {
    const file = fakeFile({ owner: "user_owner", visibility: "public" });
    await expect(
      canAccessObject({
        objectFile: file,
        requestedPermission: ObjectPermission.READ,
      }),
    ).resolves.toBe(true);
    await expect(
      canAccessObject({
        objectFile: file,
        requestedPermission: ObjectPermission.WRITE,
      }),
    ).resolves.toBe(false);
  });

  it("allows the owner and denies another user for private objects", async () => {
    const file = fakeFile({ owner: "user_owner", visibility: "private" });
    await expect(
      canAccessObject({
        userId: "user_owner",
        objectFile: file,
        requestedPermission: ObjectPermission.READ,
      }),
    ).resolves.toBe(true);
    await expect(
      canAccessObject({
        userId: "user_other",
        objectFile: file,
        requestedPermission: ObjectPermission.READ,
      }),
    ).resolves.toBe(false);
  });

  it("fails closed when metadata is absent or malformed", async () => {
    await expect(getObjectAclPolicy(fakeFile())).resolves.toBeNull();
    await expect(getObjectAclPolicy(fakeFile("{broken-json"))).resolves.toBeNull();
    await expect(
      getObjectAclPolicy(fakeFile({ visibility: "public" })),
    ).resolves.toBeNull();
  });
});