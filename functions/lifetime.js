export function isWithinLifetime(config) {
    const now = new Date();
    const start = config.startDate ? new Date(config.startDate) : null;
    const end = config.endDate ? new Date(config.endDate) : null;

    if (start && end) {
        return now >= start && now <= end;
    } else if (start) {
        return now >= start;
    } else if (end) {
        return now <= end;
    }
    return true; // Pas de restriction
}