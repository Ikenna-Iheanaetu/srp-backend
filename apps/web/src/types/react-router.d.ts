/** @format */

import { Register } from "react-router";
import { AutocompleteString } from ".";

type RoutesAndParamsMap = Register["pages"];

type RouteIds = keyof RoutesAndParamsMap;

type RouteIdsAutocomplete = AutocompleteString<RouteIds>;
