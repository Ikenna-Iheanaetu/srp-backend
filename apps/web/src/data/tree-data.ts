/** @format */

import { buildLimitedTree } from "@/components/common/tree-select/utils";
import INDUSTRIES_TREE from "./industries-tree.json";

export const COMPANY_INDUSTRY_TREE = buildLimitedTree(INDUSTRIES_TREE, 1);

export const PLAYER_INDUSTRY_TREE = buildLimitedTree(INDUSTRIES_TREE, 2);
