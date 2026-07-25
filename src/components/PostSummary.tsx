import Link from 'next/link';

export default function PostSummary(props: any) {
  const id = props._id?.toString?.() || props._id;
  return (
    <div className="paper-raised paper-raised--frame">
      <div className="p-6">
        <Link href={`/post/${id}`} className="block font-head-ebgaramond text-lg font-semibold text-[#3a2b1c] hover:text-rose-800 transition-colors">
          {props.sheetName}
        </Link>
        <p className="paper-pressed -mx-1 px-4 py-2 mt-3 text-sm text-[#6b543c]">
          <span className="font-semibold text-[#8a6f4f]">Scale: </span>
          {props.scale}
        </p>
        <p className="text-sm text-[#8a6f4f] mt-3">
          <i className="uil uil-clock text-rose-700"></i> Released on {new Date(props.date).toLocaleDateString()}
        </p>
        <div className="mt-3 text-sm text-[#6b543c]">
          <p><span className="font-semibold text-rose-800">Artists:</span> {props.Artist}</p>
          <p><span className="font-semibold text-rose-800">Genre:</span> {props.Genres}</p>
        </div>
      </div>
      <div className="flex items-center px-6 pb-6 pt-1 border-t border-[#e6d7b6]">
        <Link
          className="mt-3 text-sm font-semibold tracking-wide text-center py-2 px-4 inline-block rounded-md bg-rose-700 hover:bg-rose-800 text-[#fdf6e8] transition-colors me-2"
          href={`/post/${id}`}
        >
          View sheet
        </Link>
      </div>
    </div>
  );
}
