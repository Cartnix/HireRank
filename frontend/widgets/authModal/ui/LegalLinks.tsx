import Link from "next/link";

export function LegalLinks() {
  return (
    <>
      <Link
        href="/terms"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Условиями использования
      </Link>
      {" и актуальной "}
      <Link
        href="/privacy"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Политикой сбора и обработки персональных данных
      </Link>
    </>
  );
}
