import { useState } from "react";

const useGetQuoteOverview = () => {
  const [quoteOverview, setQuoteOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
};
