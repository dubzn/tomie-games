import { getSelectorFromTag } from "@dojoengine/utils";

const DOJO_NAMESPACE = "tobie_games";

export const getEventKey = (eventName: string) => {
  return getSelectorFromTag(DOJO_NAMESPACE, eventName);
};
