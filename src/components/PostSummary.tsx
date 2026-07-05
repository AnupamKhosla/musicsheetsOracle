import Link from 'next/link';

export default function PostSummary(props: any) {
  const id = props._id?.toString?.() || props._id;
  return (
    <div className="rounded-md shadow dark:shadow-gray-800">
      <div className="p-6">
        <Link href={`/post/${id}`} className="title h5 text-lg font-semibold hover:text-rose-600">
          {props.sheetName}
        </Link>
        <p className="bg-slate-200 -mx-6 px-6 py-2 mt-3">
          <span>Scale: </span>
          {props.scale}
        </p>
        <p className="text-slate-400 mt-2">
          <i className="uil uil-clock text-rose-600"></i> Released on {new Date(props.date).toLocaleDateString()}
        </p>
        <div className="mt-4">
          <p><span className="text-rose-600">Artists:</span> {props.Artist}</p>
          <p><span className="text-rose-600">Genre:</span> {props.Genres}</p>
        </div>
      </div>
      <div className="flex items-center p-6 border-t border-gray-100 dark:border-gray-700">
        <Link
          className="text-sm py-1 px-3 inline-block tracking-wide border align-middle transition duration-500 ease-in-out text-base text-center bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 text-white rounded-md me-2 mt-2"
          href={`/post/${id}`}
        >
          View sheet
        </Link>
      </div>
    </div>
  );
}
