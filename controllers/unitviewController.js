const Article = require('../models/unit_models/article');
const Video = require('../models/unit_models/video');
const Interview = require('../models/unit_models/interview'); // Import Interview model
const PromptSet = require('../models/unit_models/promptset');
const Template = require('../models/unit_models/template');
const Exercise = require('../models/unit_models/exercise');
const Member = require('../models/member_models/member'); // Import Member model
const Leader = require('../models/member_models/leader'); // Import Leader model
const GroupMember = require('../models/member_models/group_member'); // Import Group Member model
const mongoose = require('mongoose');





async function resolveAuthorById(authorId) {
  let author;

  // Check Leader collection
  author = await Leader.findById(authorId).select('name profileImage');
  if (author) {
    return {
      name: author.name,
      image: author.profileImage
    };
  }

  // Check GroupMember collection
  author = await GroupMember.findById(authorId).select('name profileImage');
  if (author) {
    return {
      name: author.name,
      image: author.profileImage
    };
  }

  // Check Member collection
  author = await Member.findById(authorId).select('name profileImage');
  if (author) {
    return {
      name: author.name,
      image: author.profileImage
    };
  }

  // No match found
  return null;
}





module.exports = {
    
    viewArticle: async (req, res) => {

        try {
          const { id } = req.params;
          console.log(`Fetching article with ID: ${id}`);
      
          const article = await Article.findById(id);
          if (!article) {
            console.warn(`Article with ID ${id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Article Not Found',
              errorMessage: `The article with ID ${id} does not exist.`,
            });
          }
      
          console.log('Article found:', article);
      
          const author = await resolveAuthorById(article.author.id);
          if (!author) {
            console.error(`Author with ID ${article.author.id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Author Not Found',
              errorMessage: `The author associated with this article could not be found.`,
            });
          }
      
          const isOwner = req.user && req.user.id.toString() === article.author.id.toString();
          console.log(`Is owner: ${isOwner}`);
      
          const isGroupMemberOrLeader = await GroupMember.findById(req.user._id) || await Leader.findById(req.user._id);
      
          // ✅ START: Visibility access check
          let isAuthorizedToViewFullContent = false;
      
          if (article.visibility === 'all_members') {
            isAuthorizedToViewFullContent = true;
          } else if (
            article.visibility === 'organization_only' &&
            req.user.organization &&
            author.organization &&
            req.user.organization === author.organization
          ) {
            isAuthorizedToViewFullContent = true;
          } else if (
            article.visibility === 'team_only' &&
            req.user.groupId &&
            author.groupId &&
            req.user.groupId.toString() === author.groupId.toString()
          ) {
            isAuthorizedToViewFullContent = true;
          }
      
          console.log(`Authorized to view full content: ${isAuthorizedToViewFullContent}`);
          // ✅ END
      
          res.render('unit_views/single_article', {
            layout: 'unitviewlayout',
            _id: article._id.toString(),
            article_title: article.article_title,
            short_summary: article.short_summary,
            full_summary: article.full_summary,
            article_content: article.article_content,
            article_image: '/images/default-article.png',
            author: {
              name: author.name || 'Unknown Author',
              image: author.image || '/images/default-avatar.png',
            },
            main_topic: article.main_topic,
            secondary_topics: article.secondary_topics,
            sub_topic: article.sub_topic,
            isOwner,
            isGroupMemberOrLeader,
            isAuthorizedToViewFullContent // ✅ passed to the view
          });
      
        } catch (err) {
          console.error('Error fetching article:', err.stack || err.message);
          res.status(500).render('unit_views/error', {
            layout: 'unitviewlayout',
            title: 'Error',
            errorMessage: 'An error occurred while fetching the article.',
          });
        }
      },
      
    
    

      viewVideo: async (req, res) => {

        try {
          const { id } = req.params;
          console.log(`Fetching video with ID: ${id}`);
      
          const video = await Video.findById(id);
          if (!video) {
            console.warn(`Video with ID ${id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Video Not Found',
              errorMessage: `The video with ID ${id} does not exist.`,
            });
          }
      
          console.log('Video found:', video);
      
          const author = await resolveAuthorById(video.author.id);
          if (!author) {
            console.error(`Author with ID ${video.author.id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Author Not Found',
              errorMessage: `The author associated with this video could not be found.`,
            });
          }
      
          const isOwner = req.user && req.user.id.toString() === video.author.id.toString();
          console.log(`Is owner: ${isOwner}`);
      
          const isGroupMemberOrLeader =
            await GroupMember.findById(req.user._id) || await Leader.findById(req.user._id);
      
          // ✅ Visibility access check
          let isAuthorizedToViewFullContent = false;
      
          if (video.visibility === 'all_members') {
            isAuthorizedToViewFullContent = true;
          } else if (
            video.visibility === 'organization_only' &&
            req.user.organization &&
            author.organization &&
            req.user.organization === author.organization
          ) {
            isAuthorizedToViewFullContent = true;
          } else if (
            video.visibility === 'team_only' &&
            req.user.groupId &&
            author.groupId &&
            req.user.groupId.toString() === author.groupId.toString()
          ) {
            isAuthorizedToViewFullContent = true;
          }
      
          console.log(`Authorized to view full content: ${isAuthorizedToViewFullContent}`);
      
          // ✅ Render the view with visibility flag
          res.render('unit_views/single_video', {
            layout: 'unitviewlayout',
            _id: video._id.toString(),
            video_title: video.video_title,
            short_summary: video.short_summary,
            full_summary: video.full_summary,
            video_link: video.video_link || '', // for iframe
            video_url: video.video_url || '/images/valuegroupcont.png', // fallback image
            author: {
              name: author.name || 'Unknown Author',
              image: author.image || '/images/default-avatar.png',
            },
            main_topic: video.main_topic,
            secondary_topics: video.secondary_topics,
            sub_topic: video.sub_topic,
            isOwner,
            isGroupMemberOrLeader,
            isAuthorizedToViewFullContent // ✅ for the template
          });
      
        } catch (err) {
          console.error('Error fetching video:', err.stack || err.message);
          res.status(500).render('unit_views/error', {
            layout: 'unitviewlayout',
            title: 'Error',
            errorMessage: 'An error occurred while fetching the video.',
          });
        }
      },
      
    
    
    
      viewInterview: async (req, res) => {

        try {
          const { id } = req.params;
          console.log(`Fetching interview with ID: ${id}`);
      
          const interview = await Interview.findById(id);
          if (!interview) {
            console.warn(`Interview with ID ${id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Interview Not Found',
              errorMessage: `The interview with ID ${id} does not exist.`,
            });
          }
      
          console.log('Interview found:', interview);
      
          const author = await resolveAuthorById(interview.author.id);
          if (!author) {
            console.error(`Author with ID ${interview.author.id} not found.`);
            return res.status(404).render('unit_views/error', {
              layout: 'unitviewlayout',
              title: 'Author Not Found',
              errorMessage: `The author associated with this interview could not be found.`,
            });
          }
      
          const isOwner = req.user && req.user.id.toString() === interview.author.id.toString();
          console.log(`Is owner: ${isOwner}`);
      
          const isGroupMemberOrLeader =
            await GroupMember.findById(req.user._id) || await Leader.findById(req.user._id);
      
          // ✅ Access check for contributing/paid individuals or group/leader members
          let isAuthorizedToViewFullContent = false;
      
          const isPaidOrContributor =
            req.user &&
            req.user.membershipType === 'member' &&
            (req.user.accessLevel === 'paid_individual' || req.user.accessLevel === 'contributor_individual');
      
          const isGroupUser =
            req.user &&
            (req.user.membershipType === 'group_member' || req.user.membershipType === 'leader');
      
          if (isPaidOrContributor || isGroupUser) {
            isAuthorizedToViewFullContent = true;
          }
      
          console.log(`Authorized to view full content: ${isAuthorizedToViewFullContent}`);
      
          res.render('unit_views/single_interview', {
            layout: 'unitviewlayout',
            _id: interview._id.toString(),
            interview_title: interview.interview_title,
            short_summary: interview.short_summary,
            full_summary: interview.full_summary,
            interview_link: interview.video_link || '', // YouTube embed URL
            interview_content: interview.transcript || "Transcript will be available soon.",
            author: {
              name: author.name || 'Unknown Author',
              image: author.image || '/images/default-avatar.png',
            },
            main_topic: interview.main_topic,
            secondary_topics: interview.secondary_topics,
            sub_topic: interview.sub_topic,
            isOwner,
            isGroupMemberOrLeader,
            isAuthorizedToViewFullContent // ✅ passed to the view
          });
      
        } catch (err) {
          console.error('Error fetching interview:', err.stack || err.message);
          res.status(500).render('unit_views/error', {
            layout: 'unitviewlayout',
            title: 'Error',
            errorMessage: 'An error occurred while fetching the interview.',
          });
        }
      },
      
    
    

      viewPromptset: async (req, res) => {

        try {
            const { id } = req.params;
            console.log(`Fetching prompt set with ID: ${id}`);
    
            const promptSet = await PromptSet.findById(id);
            if (!promptSet) {
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Prompt Set Not Found',
                    errorMessage: `The prompt set with ID ${id} does not exist.`,
                });
            }
    
            console.log('Prompt set found:', promptSet);
    
            const author = await resolveAuthorById(promptSet.author.id);
            if (!author) {
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Author Not Found',
                    errorMessage: `The author associated with this prompt set could not be found.`,
                });
            }
    
            const isOwner = req.user && req.user.id.toString() === promptSet.author.id.toString();
            console.log(`Is owner: ${isOwner}`);
    
            const isLeader = req.user && req.user.membershipType === 'leader';
            console.log(`Is leader: ${isLeader}`);
    
            let groupMembers = [];
            if (isLeader) {
                console.log(`Fetching group members for leader ID: ${req.user.id}`);
                groupMembers = await GroupMember.find({ groupId: new mongoose.Types.ObjectId(req.user.id) }).select('name _id');
                console.log('Group Members:', groupMembers);
            }
    
            const isGroupMember = await GroupMember.findById(req.user?._id);
            const isPaidIndividual = req.user?.membershipType === 'member' && ['paid_individual', 'contributor_individual'].includes(req.user.accessLevel);
    
            const isAuthorizedToViewFullContent = isOwner || isLeader || isGroupMember || isPaidIndividual;
    
            res.render('unit_views/single_promptset', {
                layout: 'unitviewlayout',
                _id: promptSet._id.toString(),
                promptset_title: promptSet.promptset_title,
                short_summary: promptSet.short_summary,
                full_summary: promptSet.full_summary,
                main_topic: promptSet.main_topic,
                secondary_topics: promptSet.secondary_topics,
                sub_topic: promptSet.sub_topic,
                target_audience: promptSet.target_audience,
                characteristics: promptSet.characteristics,
                purpose: promptSet.purpose,
                suggested_frequency: promptSet.suggested_frequency,
                
                prompts: [
                    promptSet.Prompt1, promptSet.Prompt2, promptSet.Prompt3, promptSet.Prompt4, promptSet.Prompt5,
                    promptSet.Prompt6, promptSet.Prompt7, promptSet.Prompt8, promptSet.Prompt9, promptSet.Prompt10,
                    promptSet.Prompt11, promptSet.Prompt12, promptSet.Prompt13, promptSet.Prompt14, promptSet.Prompt15,
                    promptSet.Prompt16, promptSet.Prompt17, promptSet.Prompt18, promptSet.Prompt19, promptSet.Prompt20,
                ],
    
                prompt_headlines: [
                    promptSet.prompt_headline1, promptSet.prompt_headline2, promptSet.prompt_headline3, promptSet.prompt_headline4, promptSet.prompt_headline5,
                    promptSet.prompt_headline6, promptSet.prompt_headline7, promptSet.prompt_headline8, promptSet.prompt_headline9, promptSet.prompt_headline10,
                    promptSet.prompt_headline11, promptSet.prompt_headline12, promptSet.prompt_headline13, promptSet.prompt_headline14, promptSet.prompt_headline15,
                    promptSet.prompt_headline16, promptSet.prompt_headline17, promptSet.prompt_headline18, promptSet.prompt_headline19, promptSet.prompt_headline20,
                ],
    
                prompt0: promptSet.Prompt0,
                prompt_headline0: promptSet.prompt_headline0,
    
                options: {
                    clarify_topic: promptSet.clarify_topic,
                    topics_and_enlightenment: promptSet.topics_and_enlightenment,
                    challenge: promptSet.challenge,
                    instructions: promptSet.instructions,
                    time: promptSet.time,
                    permission: promptSet.permission,
                },
                author: {
                    name: author.name || 'Unknown Author',
                    image: author.image || '/images/default-avatar.png',
                },
                isOwner,
                isLeader,
                isAuthorizedToViewFullContent,
                groupMembers,
            });
    
        } catch (err) {
            console.error('Error fetching prompt set:', err.stack || err.message);
            res.status(500).render('unit_views/error', {
                layout: 'unitviewlayout',
                title: 'Error',
                errorMessage: 'An error occurred while fetching the prompt set.',
            });
        }
    },
    
    
    

    
    viewExercise: async (req, res) => {

        try {
            const { id } = req.params; // Get exercise ID from route params
            console.log(`Fetching exercise with ID: ${id}`); // Debugging log
    
            // Find the exercise
            const exercise = await Exercise.findById(id);
            if (!exercise) {
                console.warn(`Exercise with ID ${id} not found.`);
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Exercise Not Found',
                    errorMessage: `The exercise with ID ${id} does not exist.`,
                });
            }
    
            // Debugging logs
            console.log("Fetched Exercise:", exercise);
            console.log("Creator ID:", exercise.author?.id); // Should NOT be undefined
    
            // Ensure the creator ID exists
            if (!exercise.author || !exercise.author.id) {
                console.error(`Missing creator ID for exercise ID: ${id}`);
                return res.status(500).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Error',
                    errorMessage: 'An error occurred while fetching the exercise creator.',
                });
            }
    
            // Resolve creator details using author.id
            const creator = await resolveAuthorById(exercise.author.id);
            if (!creator) {
                console.error(`Creator with ID ${exercise.author.id} not found.`);
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Creator Not Found',
                    errorMessage: `The creator associated with this exercise could not be found.`,
                });
            }
    
            // Check if the logged-in user is the owner of the exercise
            const isOwner = req.user && req.user.id.toString() === exercise.author.id.toString();
            console.log(`Exercise found. Is owner: ${isOwner}`);
    
            // Check if the user is a group member or leader
            const isGroupMemberOrLeader = await GroupMember.findById(req.user._id) || await Leader.findById(req.user._id);
    
            // Determine if user is a paid or contributing individual
            const isPayingIndividual =
                req.user &&
                req.user.membershipType === 'member' &&
                ['contributor_individual', 'paid_individual'].includes(req.user.accessLevel);
    
            // Determine if user is allowed to view full content
            const isAuthorizedToViewFullContent = isOwner || isGroupMemberOrLeader || isPayingIndividual;
            console.log("🧪 Auth check:");
            console.log("isOwner:", isOwner);
            console.log("isGroupMemberOrLeader:", !!isGroupMemberOrLeader);
            console.log("isPayingIndividual:", isPayingIndividual);
            console.log("accessLevel:", req.user?.accessLevel);
            console.log("membershipType:", req.user?.membershipType);
            console.log("Final isAuthorizedToViewFullContent:", isAuthorizedToViewFullContent);
            // Render the single exercise view
            res.render('unit_views/single_exercise', {
                layout: 'unitviewlayout',
                _id: exercise._id.toString(),
                exercise_title: exercise.exercise_title,
                short_summary: exercise.short_summary,
                full_summary: exercise.full_summary,
                file_format: exercise.file_format,
                creator: {
                    name: creator.name || 'Unknown Creator',
                    image: creator.image || '/images/default-avatar.png',
                },
                main_topic: exercise.main_topic,
                secondary_topics: exercise.secondary_topics,
                sub_topic: exercise.sub_topic,
                isOwner,
                isGroupMemberOrLeader,
                isAuthorizedToViewFullContent, // <-- Passed to view
            });
        } catch (err) {
            console.error('Error fetching exercise:', err.stack || err.message);
            res.status(500).render('unit_views/error', {
                layout: 'unitviewlayout',
                title: 'Error',
                errorMessage: 'An error occurred while fetching the exercise.',
            });
        }
    },
    
    
    
    
    
    viewTemplate: async (req, res) => {

        try {
            const { id } = req.params;
            console.log(`Fetching template with ID: ${id}`);
    
            const template = await Template.findById(id);
            if (!template) {
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Template Not Found',
                    errorMessage: `The template with ID ${id} does not exist.`,
                });
            }
    
            const author = await resolveAuthorById(template.author.id);
            if (!author) {
                return res.status(404).render('unit_views/error', {
                    layout: 'unitviewlayout',
                    title: 'Author Not Found',
                    errorMessage: `The author associated with this template could not be found.`,
                });
            }
    
            const isOwner = req.user && req.user.id.toString() === template.author.id.toString();
            const isGroupMemberOrLeader = await GroupMember.findById(req.user._id) || await Leader.findById(req.user._id);
    
            const isAuthorizedToViewFullContent =
                isGroupMemberOrLeader ||
                req.user?.accessLevel === 'paid_individual' ||
                req.user?.accessLevel === 'contributor_individual';
    
            res.render('unit_views/single_template', {
                layout: 'unitviewlayout',
                _id: template._id.toString(),
                template_title: template.template_title,
                short_summary: template.short_summary,
                full_summary: template.full_summary,
                template_content: template.template_content,
                author: {
                    name: author.name || 'Unknown Author',
                    image: author.image || '/images/default-avatar.png',
                },
                main_topic: template.main_topic,
                secondary_topics: template.secondary_topics,
                sub_topic: template.sub_topic,
                isOwner,
                isGroupMemberOrLeader,
                isAuthorizedToViewFullContent // ✅ Pass to the view
            });
        } catch (err) {
            console.error('Error fetching template:', err.stack || err.message);
            res.status(500).render('unit_views/error', {
                layout: 'unitviewlayout',
                title: 'Error',
                errorMessage: 'An error occurred while fetching the template.',
            });
        }
    }
    
};    