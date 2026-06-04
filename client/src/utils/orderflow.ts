export const ORDER_ACTIONS : Record<string, string[]> = {
    PLACED: ["ACCEPTED"],
    ACCEPTED: ["PREPARING"],
    PREPARING: ["READY_FOR_RIDER"],
};