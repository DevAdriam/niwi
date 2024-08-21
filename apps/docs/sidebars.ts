import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
import SidebarItemWithIcon from "@/components/niwi/side-item-with-icon";
// const SidebarItemWithIcon =
//   require("./src/components/niwi/side-item-with-icon").default;

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // tutorialSidebar: [{ type: "autogenerated", dirName: "." }],
  // But you can create a sidebar manually
  getStartTutorial: [
    {
      type: "doc",
      label: "Get Started",
      id: "intro",
      className: "side-link-gif niwi-get-started",
    },
    {
      type: "doc",
      label: "Project Structure",
      id: "project-structure",
      className: "side-link-gif niwi-project",
    },
    {
      type: "category",
      label: "Built In Feature",
      className: "side-link-gif niwi-built-in",
      items: [
        {
          type: "autogenerated",
          dirName: "built-in-feature",
        },
      ],
    },
    {
      type: "category",
      label: "Authentication",
      className: "side-link-gif niwi-auth",
      items: [
        {
          type: "autogenerated",
          dirName: "authentication",
        },
      ],
    },
    // {
    //   type: "category",
    //   label: "Testing",
    //   className: "side-link-gif niwi-testing",
    //   items: [
    //     {
    //       type: "autogenerated",
    //       dirName: "authentication",
    //     },
    //   ],
    // },
  ],
};

export default sidebars;
