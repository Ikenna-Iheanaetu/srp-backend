import { useLocation, useNavigate } from "react-router";
import { JobFormData } from "../utils/new-job-post";
import { Button } from "@/components/ui/button";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as JobFormData;
  function goBackToEdit() {
    void navigate("new", { state: data });
  }
  return (
    // <div>
    //   <h2>Received Data:</h2>
    //   <p>Name: {data?.jobTitle}</p>
    //   <p>Email: {data?.department}</p>
    // </div>
    <div className="w-full mx-auto">
      <div className="bg-slate-100 px-6 py-8">
        <h1 className="text-2xl font-bold capitalize text-center mb-4">
          {data?.jobTitle}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span>{data?.employmentType}</span>
          <span className="text-gray-300">|</span>
          <span>UK</span>
          <span className="text-gray-300">|</span>
          <span>4711 AGENCY</span>
          <span className="text-gray-300">|</span>
          <span>
            {new Date(data?.startDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3">Overview</h2>
          <p className="text-gray-600">
            4711 AGENCY - We are a reputable firm in the Maritime Logistics and
            Recruitment, is recruiting suitable candidates to fill the position
            below:
            <br />
            Job Position: Marine Engineer
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Job Description</h2>
          {/* <p className="text-gray-600">{data?.jobDescription}</p> */}
          <TextWithBullets text={data?.jobDescription} />
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Job Responsibilities</h2>
          <ul className="list-disc text-slate-600 pl-4 space-y-1">
            {data?.responsibilities}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">
            Qualifications &amp; Requirements
          </h2>
          <ul className="text-slate-600 list-disc pl-4 space-y-1">
            <li>Bachelor&apos;s degree in Marine Engineering or equivalent</li>
            <li>Minimum of 5 years experience in vessel maintenance</li>
            <li>Strong knowledge of maritime safety regulations</li>
            <li>Ability to work in high-pressure environments</li>
            <li>Certifications in marine safety procedures (STCW, MOD)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            Skills &amp; Traits Section
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium mb-1">Required Skills:</h3>
              {data?.skills.map((skill) => (
                <p key={skill} className="text-gray-600">
                  {skill}
                </p>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Preferred Traits:</h3>
              {data?.traits.map((trait) => (
                <p key={trait} className="text-gray-600">
                  {trait}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">
            Location &amp; Salary Section
          </h2>
          <div className="space-y-1 text-gray-600">
            <p>Location: {data?.location}</p>
            <p>
              Salary Range: {data?.compensationMin} - {data?.compensationMax}{" "}
              per year
            </p>
            <p>Relocation Assistance: Available</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3">Who Can Apply?</h2>
          <ul className="text-slate-600 list-disc pl-4 space-y-1">
            {data?.openToAll && <li>Open to All Candidates</li>}
            <li>
              Preferred Class: Coastal Navigators United, Oceanic Mariners FC
            </li>
          </ul>
        </section>


        <section>
          <h2 className="text-lg font-bold mb-3">How to Apply</h2>
          <ul className="text-slate-600 list-disc pl-4 space-y-1">
            <li>
              Click &quot;Apply Now&quot; to send your CV and cover letter
            </li>
            <li>For inquiries, contact hr@4711agency.com</li>
          </ul>
        </section>
      </div>

      <div className="flex gap-2 item-center justify-end">
        <Button onClick={goBackToEdit} variant="ghost" className="">
          Edit
        </Button>
        <Button className="button">Post</Button>
      </div>
    </div>
  );
};

export default Preview;

const TextWithBullets = ({ text }: { text: string }) => {
  // Split the text into lines by newline characters
  const lines = text.split("\n");

  return (
    <ul className="list-disc text-slate-600 pl-5">
      {lines.map((line, index) => {
        // If the line starts with a bullet, treat it as a list item
        if (line.startsWith("•")) {
          return <li key={index}>{line.slice(1).trim()}</li>; // Remove bullet character
        }
        return <li key={index}>{line}</li>;
      })}
    </ul>
  );
};
