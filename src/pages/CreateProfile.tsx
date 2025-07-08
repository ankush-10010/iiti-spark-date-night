import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input} from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const INTERESTS_OPTIONS = [
  "Music", "Books", "Movies", "Sports", "Travel", "Food", "Art", "Technology",
  "Gaming", "Fashion", "Photography", "Fitness", "Cooking", "Dancing", "Writing",
  "Nature", "Anime", "Coding", "Volunteering", "Business"
];

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender" }),
  bio: z.string().optional(),
  year_of_study: z.number().min(1).max(8),
  looking_for: z.enum(["dating", "friendship", "networking"], { required_error: "Please select what you're looking for" })
});

type ProfileFormData = z.infer<typeof profileSchema>;

const CreateProfile = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string>("");

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  const addInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage || !user) return null;

    const fileExt = profileImage.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('profiles')
      .upload(fileName, profileImage);

    if (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return;
    
    setCheckingUsername(true);
    setUsernameError("");
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (data) {
        setUsernameError("Username is already taken");
      } else if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        setUsernameError("");
      } else if (error) {
        console.error('Error checking username:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || usernameError) return;

    setUploading(true);
    
    try {
      let imageUrl = null;
      if (profileImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          gender: data.gender,
          bio: data.bio || '',
          interests,
          year_of_study: data.year_of_study,
          looking_for: data.looking_for,
          profile_image: imageUrl
        });

      if (error) {
        console.error('Error creating profile:', error);
        toast.error('Failed to create profile');
        return;
      }

      toast.success('Profile created successfully!');
      await refreshProfile();
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-primary" size={32} />
            <h1 className="text-2xl font-bold gradient-text">Campus Connect</h1>
          </div>
          <p className="text-muted-foreground">Complete your profile to get started</p>
        </div>

        <Card className="card-gradient animate-card-enter">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Profile</CardTitle>
            <CardDescription>
              Tell others about yourself to make meaningful connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Choose Photo</span>
                    </Button>
                  </Label>
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Enter your first name"
                  {...register("first_name")}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Enter your last name"
                  {...register("last_name")}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  {...register("username")}
                  onChange={(e) => {
                    register("username").onChange(e);
                    checkUsernameAvailability(e.target.value);
                  }}
                />
                {checkingUsername && (
                  <p className="text-sm text-muted-foreground">Checking availability...</p>
                )}
                {usernameError && (
                  <p className="text-sm text-destructive">{usernameError}</p>
                )}
                {!usernameError && !checkingUsername && watch("username") && watch("username").length >= 3 && (
                  <p className="text-sm text-success">Username is available!</p>
                )}
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  This will be used for your profile URL and mentions
                </p>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>

              {/* Year of Study */}
              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Select onValueChange={(value) => setValue("year_of_study", parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year_of_study && (
                  <p className="text-sm text-destructive">{errors.year_of_study.message}</p>
                )}
              </div>

              {/* Looking For */}
              <div className="space-y-2">
                <Label>Looking For</Label>
                <Select onValueChange={(value) => setValue("looking_for", value as "dating" | "friendship" | "networking")}>
                  <SelectTrigger>
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dating">Dating</SelectItem>
                    <SelectItem value="friendship">Friendship</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                  </SelectContent>
                </Select>
                {errors.looking_for && (
                  <p className="text-sm text-destructive">{errors.looking_for.message}</p>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="cursor-pointer">
                      {interest}
                      <X
                        className="ml-1 h-3 w-3"
                        onClick={() => removeInterest(interest)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addInterest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add interests" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERESTS_OPTIONS.filter(option => !interests.includes(option)).map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                  {...register("bio")}
                />
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={uploading}>
                {uploading ? "Creating Profile..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProfile;