import openai
import os
from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
import json
import re


class IncludeExpertInConversation():

    def __init__(self, api_key) -> None:
        completion_model = "gpt-4-turbo"
        self.gpt_llm = ChatOpenAI(model_name= completion_model, temperature=0, openai_api_key=api_key)

    def summarise_conversation(self, conversation_path):
        with open(conversation_path, 'r') as f:
            conversation = f.read()

        summary_messages = [
            SystemMessage(
                content=("You are a helpful assistant, who answers questions and summarises information. You are skilled at reading text "
                        "and conversations, and can distinguish between speakers, as well as understand the topics of discussion. You "
                        "provide exact and concise answers."
                )
            ),
            HumanMessage(
                content=("You are given a conversation between a number of people below, under ###Conversation###. The people take turns speaking, "
                        "and the beginning of each speaker's part is highlighted by the speaker's name, enclosed in '<s' and '/s>' symbols. "
                        "Read the conversation, and fill in the tasks under '###Answer###', following the given format. "
                        "###Answer###\n"
                        "List of participants: *List the names of the speakers, separated by commas* \n"
                        "Main topic of conversation: *In one sentence, summarise the main topic of conversation and discussion.* \n"
                        "Conversation keywords: *List 3 to 5 key words or phrases, in descending order, that best capture the main topic of the conversation.* \n"
                        "###Conversation###: {conversation}"
                ).format(conversation=conversation),
            )]

        summary_step = self.gpt_llm.invoke(summary_messages).content
        clean_summary_step = summary_step.split("###Answer###")[-1]

        return clean_summary_step

    def call_person_for_conversation(self, persons_list, clean_summary_step):
        with open(persons_list, 'r') as pl:
            persons = json.load(pl)

        call_messages = [
            SystemMessage(
                content=("You are a helpful assistant, who answers questions, summarises information and finds connections "
                        "between pieces of information. You are skilled at reading text and can figure out if expertise is "
                        "needed in a conversation, based on how much they can contribute to the topic. You provide exact and "
                        "concise answers."
                )
            ),
            HumanMessage(
                content=("You are given a dictionary, under ###People###, where the key is a person's name and the value is their "
                        "expertise and a description of them. You are also given a description of a conversation, under ###Conversation###, "
                        "with its participants, main topic and most important keywords and phrases (in descending order of importance). Read "
                        "the conversation description and answer if any of the people listed in the 'People' list should be included in the "
                        "conversation. Choonse the person who can contribute to the conversation the most, based on how well their expertise "
                        "and description match the conversation topic and the main key points. Explain your thinking step by step and provide "
                        "the person's name at the end, eclosed in '<ans>' and '</ans>'."
                        "###People###\n{people_dict}\n"
                        "###Conversation###\n{conversation_decription}"
                ).format(people_dict=persons, conversation_decription=clean_summary_step),
            )]

        call_step = self.gpt_llm.invoke(call_messages).content
        re_pattern = r'<ans>(.*?)</ans>'
        matches = re.findall(re_pattern, call_step, re.DOTALL)
        return matches[-1] if matches else "No name mentioned"

    def consensus_pick_person(self, conversation_path, persons_list):
        person_votes = {}
        for _ in range(10):
            clean_summary = self.summarise_conversation(conversation_path)
            chosen_person = self.call_person_for_conversation(persons_list, clean_summary)
            if chosen_person not in person_votes:
                person_votes.update({chosen_person: 1})
            else:
                person_votes[chosen_person] += 1
        
        return person_votes

# if __name__ == "__main__":
#     api_key = ""
#     IncludeObj = IncludeExpertInConversation(api_key)

#     conversation_path = '/home/stefan/OXD_docs/AVIS_search_engine/gladiator/conversation_example_2.txt'
#     persons_list = '/home/stefan/OXD_docs/AVIS_search_engine/gladiator/personas_high_diversity.json'
    
#     votes = IncludeObj.consensus_pick_person(conversation_path, persons_list)
#     print(votes)
#     print(max(votes, key=votes.get))

    