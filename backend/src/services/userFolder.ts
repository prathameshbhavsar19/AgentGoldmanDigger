import fs from "fs/promises";
import { userDir, userFile } from "../utils/paths.js";

const MD_TEMPLATE = (uid: string, sessionId: string) => {
  const now = new Date().toISOString();
  return `# Portfolio GPS — User Onboarding Record

- **User ID:** ${uid}
- **Session ID:** ${sessionId}
- **Created:** ${now}
- **Last Updated:** ${now}

<!-- section:customer -->
## Customer Details
_(awaiting input)_
<!-- /section:customer -->

<!-- section:goal -->
## Investment Goal
_(awaiting input)_
<!-- /section:goal -->

<!-- section:horizon -->
## Time Horizon
_(awaiting input)_
<!-- /section:horizon -->

<!-- section:capacity -->
## Monthly Investment Capacity
_(awaiting input)_
<!-- /section:capacity -->

<!-- section:emergency -->
## Emergency Savings
_(awaiting input)_
<!-- /section:emergency -->

<!-- section:risk -->
## Risk Reaction
_(awaiting input)_
<!-- /section:risk -->

<!-- section:familiarity -->
## Investment Familiarity
_(awaiting input)_
<!-- /section:familiarity -->

<!-- section:status -->
## Investment Status
_(awaiting input)_
<!-- /section:status -->

<!-- section:portfolio -->
## Portfolio
_(awaiting input)_
<!-- /section:portfolio -->

<!-- section:review_intent -->
## Portfolio Review Intent
_(awaiting input)_
<!-- /section:review_intent -->

<!-- section:consent -->
## Consent
_(not given)_
<!-- /section:consent -->

<!-- section:activity_log -->
## Activity Log
- ${now} — session created
<!-- /section:activity_log -->
`;
};

export const userFolder = {
  async create(uid: string, sessionId: string): Promise<string> {
    const dir = userDir(uid);
    await fs.mkdir(dir, { recursive: true });
    const mdPath = userFile(uid, "user_data.md");
    await fs.writeFile(mdPath, MD_TEMPLATE(uid, sessionId), "utf-8");
    return dir;
  },

  async exists(uid: string): Promise<boolean> {
    try {
      await fs.access(userDir(uid));
      return true;
    } catch {
      return false;
    }
  },
};
