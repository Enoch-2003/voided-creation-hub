
export function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Student Request",
      description: "Student submits an outpass request with exit details and reason",
    },
    {
      step: "2",
      title: "Mentor Review",
      description: "Assigned mentor reviews and approves or denies the request",
    },
    {
      step: "3",
      title: "QR Generation",
      description: "Approved requests generate a secure time-limited QR code",
    },
    {
      step: "4",
      title: "Security Verification",
      description: "QR code is scanned by security for verified campus exit",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Simple, streamlined, and secure process for campus exit approvals
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative p-6 rounded-lg border bg-card text-card-foreground"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-amiblue-500 text-white flex items-center justify-center font-semibold text-sm">
                {item.step}
              </div>
              <h3 className="text-lg font-display font-semibold mt-3 mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
