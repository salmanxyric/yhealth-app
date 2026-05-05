import { redirect } from "next/navigation";

export const metadata = {
    title: "Upgrade · Balencia",
};

export default function UpgradePage() {
    redirect("/subscription");
}
