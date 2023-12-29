import ChannelsSidebar from "../components/channels-sidebar";

export default async function Page() {
  return (
    <div className="grid grid-cols-[20%,auto]">
      <div className="bg-gray-950/55 rounded-l-md text-gray-300">
        <ChannelsSidebar />
      </div>
      <div className="bg-white rounded-r-md flex flex-col justify-center items-center">
        <div className="p-16 text-gray-500">Pick a Channel</div>
      </div>
    </div>
  );
}
