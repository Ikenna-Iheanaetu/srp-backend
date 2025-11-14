/** @format */

import React from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Records found",
  description = "No Transaction has been recorded",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
      {/* Empty State Illustration */}
      <div className="mb-6">
        <img
          src="/assets/icons/empty-state.svg"
          alt="Empty state illustration"
          width="120"
          height="120"
          className="mx-auto"
        />
      </div>

      {/* Text Content */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};
