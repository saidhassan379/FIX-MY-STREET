const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed with status ${response.status}`
    );
  }

  if (data?.success === false) {
    throw new Error(data?.error || data?.message || "The server could not complete the request.");
  }

  return data;
}

export async function submitReport(photo, latitude, longitude, description) {
  const formData = new FormData();

  formData.append("photo", photo);
  formData.append("latitude", latitude);
  formData.append("longitude", longitude);
  formData.append("description", description || "");

  const response = await fetch(`${API_BASE_URL}/api/reports/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response);

  if (!data?.report?.report_id) {
    throw new Error("The backend response did not contain a report ID.");
  }

  return data.report;
}

export async function getReport(reportId) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/${encodeURIComponent(reportId)}`
  );

  const data = await parseResponse(response);

  if (!data?.report) {
    throw new Error("The backend response did not contain a report.");
  }

  return data.report;
}

export { API_BASE_URL };
