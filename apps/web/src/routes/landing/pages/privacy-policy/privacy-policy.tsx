import data from "./privacy-policy.json";
import HeaderWithSearch from "./components/header-with-search";
import { useEffect, useState } from "react";
interface SubItem {
  text?: string;
  sub?: string[];
}

interface Item {
  index: string;
  text: string;
  subItems?: SubItem[];
}

interface Section {
  title: string;
  content: Item[];
}

// interface PrivacyPolicyData {
//   sections: Section[];
// }

const PrivacyPolicy = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState<Section[]>([]);
  const [open, setOpen] = useState(false);
  const [hideWelcomeText, setHideWelcomeText] = useState(false);
  useEffect(() => {
    if (data) {
      setPrivacyPolicy(data.sections);
    }
  }, []);

  function setPolicyAndCloseFirstWelcomeText(chosenPolicy: Section[]) {
    setPrivacyPolicy(chosenPolicy);
    setHideWelcomeText(true);
  }
  // console.log(privacyPolicy);
  return (
    <>
      {open && (
        <div className="fixed inset-0 top-0 bg-slate-800/60 z-20 w-full h-dvh overflow-hidden bg-cover" />
      )}

      <HeaderWithSearch
        setPolicy={setPolicyAndCloseFirstWelcomeText}
        open={open}
        setOpen={setOpen}
      />
      <div className="flex items-center justify-center bg-white">
        <div className="flex flex-col items-start w-full max-w-7xl px-4 sm:px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-24">
          {!hideWelcomeText && (
            <p className="w-full max-w-2xl mb-4 text-slate-600 text-sm sm:text-base">
              Welcome to Sports & Rekryteing. By accessing, using, or
              registering on our platform ("Platform"), you agree to comply with
              and be bound by these Terms and Conditions ("Terms"). If you do
              not agree with these Terms, you should not use our Platform. These
              Terms govern your access to and use of our website, mobile
              application, and all associated services (collectively, the
              &quot;Services&quot;).
            </p>
          )}
          {privacyPolicy?.map((section, index) => (
            <div
              key={index}
              className="w-full mb-6 md:mb-8 max-w-2xl text-slate-600"
            >
              <h2 className="text-lg sm:text-xl font-bold mb-3 md:mb-4 text-zinc-900">
                {section.title}
              </h2>
              {section.content.map((item, idx) => (
                <div key={idx} className="mb-3 md:mb-4">
                  <p className="font-semibold text-sm sm:text-base">
                    {item.index} {item.text}
                  </p>
                  {item.subItems && (
                    <ul className="pl-4 sm:pl-6 list-disc mt-2 text-gray-700 text-sm sm:text-base">
                      {item.subItems.map((subItem, i) => (
                        <li key={i} className="mb-1">
                          <p>{subItem.text}</p>
                          {subItem.sub && (
                            <ul className="pl-4 sm:pl-6 list-disc mt-2 text-gray-700">
                              {subItem.sub?.map((subItem, j) => (
                                <li key={j} className="mb-1">
                                  <p>{subItem}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
          <h2 className="text-lg sm:text-xl mb-1 font-bold text-zinc-900">
            How can you contact us about this policy?
          </h2>
          <p className="text-sm sm:text-base">
            For questions or concerns regarding these Terms, contact us at:
          </p>
          <ul className="list-disc pl-4 sm:pl-6 mt-2 text-gray-700 text-sm sm:text-base">
            <li className="mb-1">
              Email:{" "}
              <a
                href="mailto:support@sportsrekryteing.com"
                className="text-blue-600 hover:text-blue-800"
              >
                support@sportsrekryteing.com
              </a>
            </li>
            <li>Phone: +1-800-555-1234</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
