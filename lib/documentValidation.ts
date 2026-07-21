export const DOCUMENT_TYPES = new Set([
    "receipt",
    "field_photo",
    "vet_record",
    "buyer_contract",
    "loan_document",
    "insurance_evidence",
    "certificate",
    "other",
]);

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_URL_EXTENSIONS = /\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i;

export type ParsedDocumentDataUrl = {
    contentType: string;
    payload: string;
    isBase64: boolean;
    estimatedBytes: number;
};

function estimateBase64Bytes(payload: string) {
    const clean = payload.replace(/\s/g, "");
    const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
    return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
}

export function parseDocumentDataUrl(url: string): ParsedDocumentDataUrl | null {
    const commaIndex = url.indexOf(",");
    if (!url.startsWith("data:") || commaIndex === -1) return null;

    const meta = url.slice(5, commaIndex);
    const payload = url.slice(commaIndex + 1);
    const parts = meta.split(";").map((part) => part.trim()).filter(Boolean);
    const contentType = parts[0] ?? "";
    const isBase64 = parts.includes("base64");

    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(contentType)) return null;

    return {
        contentType,
        payload,
        isBase64,
        estimatedBytes: isBase64 ? estimateBase64Bytes(payload) : payload.length,
    };
}

export function normalizeDocumentUrl(rawUrl: unknown) {
    let url = String(rawUrl ?? "").trim();
    if (!url) return { ok: false as const, error: "File or document link is required" };

    if (url.startsWith("data:")) {
        const parsed = parseDocumentDataUrl(url);
        if (!parsed) {
            return { ok: false as const, error: "Only PDF, Word documents, JPG, PNG, and WebP images are supported" };
        }
        if (parsed.estimatedBytes > MAX_DOCUMENT_UPLOAD_BYTES) {
            return { ok: false as const, error: "Document uploads must be 10 MB or smaller" };
        }
        return { ok: true as const, url, size: parsed.estimatedBytes };
    }

    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { ok: false as const, error: "Document link is invalid" };
    }

    if (parsed.protocol !== "https:") {
        return { ok: false as const, error: "Document links must use HTTPS" };
    }

    if (!ALLOWED_URL_EXTENSIONS.test(parsed.pathname)) {
        return { ok: false as const, error: "Links must point to a PDF, Word document, or image file" };
    }

    return { ok: true as const, url: parsed.toString(), size: null };
}

export function validateDocumentInput(body: any) {
    const name = String(body?.name ?? "").trim();
    const type = String(body?.type ?? "").trim();

    if (!name || !type || !body?.url) {
        return { ok: false as const, error: "Name, type and file/link are required" };
    }
    if (!DOCUMENT_TYPES.has(type)) {
        return { ok: false as const, error: "Unsupported document type" };
    }

    const normalized = normalizeDocumentUrl(body.url);
    if (!normalized.ok) return normalized;

    const reportedSize = body?.size ? Number(body.size) : normalized.size;
    if (reportedSize && reportedSize > MAX_DOCUMENT_UPLOAD_BYTES) {
        return { ok: false as const, error: "Document uploads must be 10 MB or smaller" };
    }

    return {
        ok: true as const,
        name,
        type,
        url: normalized.url,
        size: reportedSize ?? null,
    };
}
