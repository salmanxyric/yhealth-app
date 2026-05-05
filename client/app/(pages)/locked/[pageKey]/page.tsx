import { LockedFeatureScreen } from "@/components/subscription/LockedFeatureScreen";

interface Props {
    params: Promise<{ pageKey: string }>;
}

export default async function LockedPage({ params }: Props) {
    const { pageKey } = await params;
    return (
        <div className="min-h-screen bg-slate-950">
            <LockedFeatureScreen pageKey={pageKey} />
        </div>
    );
}
