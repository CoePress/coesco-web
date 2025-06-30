import Button from "@/components/common/button";
import Body from "@/components/common/text";
import Input from "@/components/common/input";
import Select from "@/components/common/select";

const Design = () => {
  return (
    <div className="flex gap-8 items-start justify-center h-[100dvh] p-8">
      <div className="flex flex-col gap-2 items-center">
        <Body
          as="h3"
          className="mb-2">
          Buttons
        </Body>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="primary-outline">Primary Outline</Button>
        <Button variant="secondary-outline">Secondary Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <Body
          as="h3"
          className="mb-2">
          Typography
        </Body>
        <Body as="h1">Heading 1</Body>
        <Body as="h2">Heading 2</Body>
        <Body as="h3">Heading 3</Body>
        <Body as="h4">Heading 4</Body>
        <Body as="p">Paragraph</Body>
      </div>

      <div className="flex flex-col gap-4 items-start w-64">
        <Body
          as="h3"
          className="mb-2 self-center">
          Inputs
        </Body>

        <Input
          label="Text Input"
          placeholder="Enter your name"
          required
        />

        <Input
          type="email"
          label="Email Input"
          placeholder="Enter your email"
        />

        <Input
          type="password"
          label="Password Input"
          placeholder="Enter your password"
        />

        <Input
          label="Disabled Input"
          placeholder="This is disabled"
          disabled
        />

        <Input
          label="Error Input"
          placeholder="Error state"
          value="Invalid value"
          error="This field is required"
        />

        <Select
          label="Select Input"
          placeholder="Choose an option"
          options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
          ]}
        />
      </div>
    </div>
  );
};

export default Design;
