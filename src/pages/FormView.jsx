import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const FormView = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          console.log("No such form found!");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  // Forces a direct download to the user's device instead of opening a new tab
  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      // Grab the extension (.pdf, .jpg, etc) from the original URL
      const ext = url.split(".").pop().split(/#|\?/)[0];
      link.download = `${filename}.${ext}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, falling back to new tab", error);
      window.open(url, "_blank"); // Fallback if CORS blocks the fetch
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-(--color-secondary)">
        Loading form details...
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-(--color-accent) mb-4">
          Form Not Found
        </h2>
        <Link to="/forms" className="text-(--color-primary) hover:underline">
          Return to Forms Directory
        </Link>
      </div>
    );
  }

  const isPdf = formData.url.toLowerCase().includes(".pdf");

  // Securely intercept and convert PDF endpoints into static image previews dynamically via Cloudinary transformations
  const displayUrl = isPdf
    ? formData.url.replace(/\.pdf$/i, ".jpg")
    : formData.url;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top Navigation & Title */}
      <div className="mb-6">
        <Link
          to="/forms"
          className="text-sm text-(--color-secondary) hover:text-(--color-primary) transition mb-2 inline-block"
        >
          &larr; Back to Directory
        </Link>
        <h1 className="text-3xl font-bold text-(--color-primary) border-b pb-4 border-gray-200">
          {formData.title}
        </h1>
      </div>

      {/* Form Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            {isPdf ? "Document Preview (Page 1)" : "Image Preview"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleDownload(
                  formData.url,
                  formData.title.replace(/\s+/g, "_"),
                )
              }
              className="text-xs md:text-sm bg-(--color-primary) text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:opacity-90 transition font-bold cursor-pointer"
            >
              Download
            </button>
            <a
              href={formData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm bg-(--color-primary) text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow hover:opacity-90 transition font-bold"
            >
              View Full Size
            </a>
          </div>
        </div>

        <a
          href={formData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer w-full flex justify-center hover:opacity-95 transition"
          title="Click to view full attachment"
        >
          <img
            src={displayUrl}
            alt={formData.title}
            className="max-w-full h-auto max-h-[70vh] rounded shadow-sm border border-gray-100 object-contain"
          />
        </a>
      </div>
    </div>
  );
};

export default FormView;
