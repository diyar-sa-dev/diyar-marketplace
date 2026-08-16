export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-xs text-red-600 font-medium mt-1 text-right">{message}</p>;
}
