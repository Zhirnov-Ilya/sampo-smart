export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("ru-RU");
}

export function getPriorityLabel(priorityScore: number | null | undefined): string {
  if (priorityScore == null) return "—";
  if (priorityScore >= 8) return "Высокий";
  if (priorityScore >= 5) return "Средний";
  return "Низкий";
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "Новая";
    case "accepted":
      return "Принята";
    case "rejected":
      return "Отклонена";
    case "in_progress":
      return "В работе";
    case "done":
      return "Завершена";
    default:
      return status;
  }
}