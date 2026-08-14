import { BillingPageScreen } from "@/components/billing-page-screen";

export default async function BillingPage(props: PageProps<"/dashboard/billing">) {
  const searchParams = await props.searchParams;
  const checkoutState =
    typeof searchParams.checkout === "string" ? searchParams.checkout : undefined;

  return <BillingPageScreen checkoutState={checkoutState} />;
}
