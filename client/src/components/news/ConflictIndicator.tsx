import { AlertTriangle } from "lucide-react";
import { InlineCitation } from "./SourceCitation";

interface ClaimData {
  id: number;
  statement: string;
  isConflicting: boolean | null;
  articles: any[];
  conflictingClaim?: {
    id: number;
    statement: string;
    articles: any[];
  };
}

export function ConflictingClaimsPanel({ claim }: { claim: ClaimData }) {
  if (!claim.isConflicting || !claim.conflictingClaim) return null;

  return (
    <div className="border border-amber-200 rounded-lg bg-amber-50/50 p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
          Conflicting Evidence
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="p-3 bg-white rounded-lg border border-amber-100">
          <p className="text-sm text-gray-700">
            {claim.statement}
            <InlineCitation articles={claim.articles} />
          </p>
        </div>
        <div className="p-3 bg-white rounded-lg border border-amber-100">
          <p className="text-sm text-gray-700">
            {claim.conflictingClaim.statement}
            <InlineCitation articles={claim.conflictingClaim.articles} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function ClaimWithCitation({
  claim,
  showConflict = true,
}: {
  claim: ClaimData;
  showConflict?: boolean;
}) {
  if (showConflict && claim.isConflicting && claim.conflictingClaim) {
    return <ConflictingClaimsPanel claim={claim} />;
  }

  return (
    <div className="py-1.5">
      <p className="text-sm text-gray-700 leading-relaxed">
        {claim.statement}
        <InlineCitation articles={claim.articles} />
      </p>
    </div>
  );
}
