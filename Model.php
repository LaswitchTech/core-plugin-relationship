<?php

/**
 * Core Framework - RelationshipModel
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Model;

class RelationshipModel extends Model {

    /**
     * Retrieve Relationships
     *
     * @param string $table
     * @param int $id
     * @return array
     */
    public function get(string $table, int $id): array
    {
        // Create the Query
        $Sources = $this->Database->query()
            ->table('relationships')
            ->select('*')
            ->index('id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('sourceTable', $table)
            ->where('sourceId', $id)
            ->result();

        // Create the Query
        $Targets = $this->Database->query()
            ->table('relationships')
            ->select('*')
            ->index('id')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('targetTable', $table)
            ->where('targetId', $id)
            ->result();

        // Merge the Results
        $Relationships = $Sources;
        foreach($Targets as $TargetId => $Target){
            $Relationships[$TargetId] = $Target;
        }

        // Initiate Relations
        $Relations = [];

        // Loop through the Relationships
        foreach($Relationships as $Relationship){

            // Check if the Record is already set
            if(!isset($Relations[$Relationship['sourceTable']][$Relationship['sourceId']])){

                // Retrieve the Record
                $Record = $this->Database->query()
                    ->table($Relationship['sourceTable'])
                    ->select('*')
                    ->filter()
                    ->where('id', 9999, '<>')
                    ->filter()
                    ->where('id', $Relationship['sourceId'])
                    ->limit(1)
                    ->result();

                // Set the Record if it exists
                if(!empty($Record)){
                    $Relations[$Relationship['sourceTable']][$Relationship['sourceId']] = $Record[array_key_first($Record)];
                }
            }

            // Check if the Record is already set
            if(!isset($Relations[$Relationship['targetTable']][$Relationship['targetId']])){

                // Retrieve the Record
                $Record = $this->Database->query()
                    ->table($Relationship['targetTable'])
                    ->select('*')
                    ->filter()
                    ->where('id', 9999, '<>')
                    ->filter()
                    ->where('id', $Relationship['targetId'])
                    ->limit(1)
                    ->result();

                // Set the Record if it exists
                if(!empty($Record)){

                    // Check if the Record has a vCard
                    if(array_key_exists("vcard", $Record[array_key_first($Record)])){

                        // Retrieve the vCard
                        $vCard = $this->Database->query()
                            ->table('vcards')
                            ->select('*')
                            ->filter()
                            ->where('id', 9999, '<>')
                            ->filter()
                            ->where('id', $Record[array_key_first($Record)]['vcard'])
                            ->limit(1)
                            ->result();

                        // Set the vCard if it exists
                        if(!empty($vCard)){
                            $Record[array_key_first($Record)]['vcard'] = $vCard[array_key_first($vCard)];
                        }
                    }

                    // Set the Record
                    $Relations[$Relationship['targetTable']][$Relationship['targetId']] = $Record[array_key_first($Record)];
                }
            }
        }

        // Remove the Object from the Relations
        if(array_key_exists($table, $Relations)){
            if(array_key_exists($id, $Relations[$table])){
                unset($Relations[$table][$id]);
            }
            if(count($Relations[$table]) == 0){
                unset($Relations[$table]);
            }
        }

        // Return the Results
        return $Relations;
    }

    /**
     * Create a new relationship and return the id
     *
     * @param string $sourceTable
     * @param int $sourceId
     * @param string $targetTable
     * @param int $targetId
     * @return int
     */
    public function create(string $sourceTable, int $sourceId, string $targetTable, int $targetId): int
    {
        // Import Global Variables
        global $AUTH, $CONFIG;

        // Set the owner
        $owner = $AUTH->isAuthenticated() ? $AUTH->user()->username : $CONFIG->get('database','username');

        // Retrieve any existing relationships
        $Relationship = $this->Database->query()
            ->table('relationships')
            ->select('*')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('sourceTable', $sourceTable)
            ->where('sourceId', $sourceId)
            ->where('targetTable', $targetTable)
            ->where('targetId', $targetId)
            ->limit(1)
            ->result();

        // Check if the relationship already exists
        if(!empty($Relationship)){
            return $Relationship[array_key_first($Relationship)]['id'];
        }

        // Create the Query
        $Query = $this->Database->query()
            ->table('relationships')
            ->insert([
                'owner' => $owner,
                'sourceTable' => $sourceTable,
                'sourceId' => $sourceId,
                'targetTable' => $targetTable,
                'targetId' => $targetId,
            ]);

        // Execute the Query
        $affectedRows = $Query->execute();

        // Execute the Query
        return $Query->lastId();
    }

    /**
     * Remove an existing relationship
     *
     * @param string $sourceTable
     * @param int $sourceId
     * @param string $targetTable
     * @param int $targetId
     * @return int
     */
    public function remove(string $sourceTable, int $sourceId, string $targetTable, int $targetId): int
    {
        // Retrieve any existing relationships
        $Relationship = $this->Database->query()
            ->table('relationships')
            ->delete()
            ->filter("OR")
            ->where('sourceTable', $sourceTable)
            ->where('sourceId', $sourceId)
            ->where('targetTable', $targetTable)
            ->where('targetId', $targetId)
            ->filter("OR")
            ->where('sourceTable', $targetTable)
            ->where('sourceId', $targetId)
            ->where('targetTable', $sourceTable)
            ->where('targetId', $sourceId);

        // Execute the Query
        $affectedRows = $Relationship->execute();

        // Return the number of affected rows
        return $affectedRows;
    }
}
