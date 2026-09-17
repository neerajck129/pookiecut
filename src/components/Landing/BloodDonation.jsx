import { siteConfig } from "../../config/siteConfig.js";

export default function BloodDonation() {
  const handleJoin = () => {
    window.open(siteConfig.bloodDirectoryUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="pc-blood">
      <h2 className="pc-blood__heading">ARE YOU READY TO BE A PART OF OUR BLOOD DONATION DIRECTORY..?</h2>
      

      <div className="pc-blood__card">
        <div className="pc-blood__title">🩸 BLOOD DONATION DIRECTORY</div>
        <p className="pc-blood__desc">
          Power cut എപ്പോ വേണമെങ്കിലും വരാം.
          <br />
          Emergency-ൽ രക്തം വേണ്ടിവരുന്നത് അതിലും serious ആണ്.
          <br />
          രക്തം ദാനം ചെയ്യാൻ തയ്യാറാണെങ്കിൽ blood directory-യിൽ details ചേർക്കാം.
        </p>
        <button type="button" className="pc-blood__cta" onClick={handleJoin}>
          JOIN BLOOD DIRECTORY →
        </button>
        <p className="pc-blood__note">
          കുറിപ്പ്: രക്തദാനത്തിന് മുമ്പ് നിങ്ങളുടെ യോഗ്യതയും ആരോഗ്യസ്ഥിതിയും
          ബന്ധപ്പെട്ട ആരോഗ്യപ്രവർത്തകരോട് സ്ഥിരീകരിക്കുക.
        </p>
      </div>
    </section>
  );
}
