export function formatCurrency(amount: number, currency: string = "EGP"): string {
  return `${amount.toLocaleString("en-EG", { minimumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}
