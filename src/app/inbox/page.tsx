import Breadcrumb from "@/components/Breadcrumb";

export default function Inbox() {
  return (
    <div>
      <Breadcrumb segments={[{ label: "Inbox" }]} />
      <h1 className="text-9xl text-center">Inbox</h1>
    </div>
  );
}
