import Breadcrumb from "@/components/Breadcrumb";

export default function Help() {
  return (
    <div>
      <Breadcrumb segments={[{ label: "Help" }]} />
      <h1 className="text-9xl text-center">Help</h1>
    </div>
  );
}
